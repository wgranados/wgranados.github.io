def is_float(s):
    '''(str) -> bool

    Return True iff the string represents a valid floating point number
    (i.e., it can be converted to float without problems)

    >>> is_float("3")
    True
    >>> is_float("-2.7")
    True
    >>> is_float("Two")
    False

    '''
    # We haven't covered exceptions yet, so don't worry about actually showing
    # this. We'll get to exceptions shortly, but for now students can just
    # use it as-is.

    try:
        float(s)
        result = True
    except:
        result = False
    return result


def evaluate_water(ph_input):
    '''(str) -> str
    Given a string representing a ph reading of water, return a string
    explaining how acidic or basic the water is. The following messages
    are possible:

    ph values above 11 or less than 2 - 'Run'
    ph values above 7 up to 11 - 'That's pretty acidic stuff'
    ph value of 7 - 'Your water is neutral'
    ph values below 7 but above 5 - 'Your water is acidic, but you're
                                     probably okay'
    ph values below 5 down to 2 - 'That's pretty acidic, I wouldn't
                                   drink it'
    any invalid string - 'Not a valid PH'

    >>> evaluate_water("7")
    'Your water is neutral'
    >>> evaluate_water("7.5")
    "That's pretty basic stuff"
    '''
    if(is_float(ph_input)):
        ph = float(ph_input)
        if(ph < 7.0):
            if(ph > 5.0):
                return "Your water is acidic, but you're probably okay"
            else:
                if(ph < 2):
                    return "RUN!"
                else:
                    return "That's pretty acidic, I wouldn't drink it"
        else:
            if(ph > 7.0):
                if(ph > 11):
                    return "RUN!"
                else:
                    return "That's pretty basic stuff"
            else:
                return "Your water is neutral"
    else:
        return "Not a valid PH!"


def evaluate_water(ph_input):
    '''(str) -> str
    Given a string representing a ph reading of water, return a string
    explaining how acidic or basic the water is. The following messages
    are possible:

    ph values above 11 or less than 2 - 'Run'
    ph values above 7 up to 11 - 'That's pretty acidic stuff'
    ph value of 7 - 'Your water is neutral'
    ph values below 7 but above 5 - 'Your water is acidic, but you're
                                     probably okay'
    ph values below 5 down to 2 - 'That's pretty acidic, I wouldn't
                                   drink it'
    any invalid string - 'Not a valid PH'

    >>> evaluate_water("7")
    'Your water is neutral'
    >>> evaluate_water("7.5")
    "That's pretty basic stuff"
    '''
    # A better approach

    # if it's not a float, tell the user
    if(is_float(ph_input)):
        ph = float(ph_input)
        # first deal with unrealistic ph levels
        if((ph > 11) or (ph < 2)):
            resut = "RUN!"
        # deal with anything over 7
        elif(ph > 7):
            result = "That's pretty basic stuff"
        # deal with the case of it being exactly 7
        elif(ph == 7):
            result = "Your water is neutral"
        # deal with anything over five (and since we're using an elif, we know
        # that it's below 7 at this point)
        elif(ph > 5):
            result = "Your water is acidic, but you're probably okay"
        # if we reached this point, we know that the ph is 5 or lower
        else:
            result = "That's pretty acidic, I wouldn't drink it"
    else:
        result = "Not a valid PH!"
    return result


# Given a PH value, output a message
ph_input = input("Enter PH value: ")
result = evaluate_water(ph_input)
print(result)
